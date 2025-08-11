import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number

  @Column('varchar', { nullable: false, length: 255, unique: true })
  name: string
}
